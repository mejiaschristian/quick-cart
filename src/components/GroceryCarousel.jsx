function GroceryCarousel() {
    return (
        <>
            <div
                id="carouselExampleCaptions"
                className="carousel slide w-100"
                data-bs-ride="carousel"
            >
                <div className="carousel-indicators">
                    <button
                        type="button"
                        data-bs-target="#carouselExampleCaptions"
                        data-bs-slide-to="0"
                        className="active"
                        aria-current="true"
                        aria-label="Slide 1"
                    ></button>
                    <button
                        type="button"
                        data-bs-target="#carouselExampleCaptions"
                        data-bs-slide-to="1"
                        aria-label="Slide 2"
                    ></button>
                    <button
                        type="button"
                        data-bs-target="#carouselExampleCaptions"
                        data-bs-slide-to="2"
                        aria-label="Slide 3"
                    ></button>
                </div>
                <div className="carousel-inner">
                    <div className="carousel-item active">
                        <img
                            src="c1.png"
                            className="d-block w-100 img-fluid"
                            alt="..."
                        />
                        <div className="carousel-caption d-none d-md-block">
                            <h5>Fresh Item Selection</h5>
                            <p>
                                Assured quality and freshness in every grocery
                                item we offer.
                            </p>
                        </div>
                    </div>
                    <div className="carousel-item">
                        <img
                            src="c2.png"
                            className="d-block w-100 img-fluid"
                            alt="..."
                        />
                        <div className="carousel-caption d-none d-md-block">
                            <h5>Fresh Meat Offerings</h5>
                            <p>
                                Premium quality meat products sourced from
                                trusted suppliers.
                            </p>
                        </div>
                    </div>
                    <div className="carousel-item">
                        <img
                            src="c3.png"
                            className="d-block w-100 img-fluid"
                            alt="..."
                        />
                        <div className="carousel-caption d-none d-md-block">
                            <h5>Many More Options</h5>
                            <p>
                                Some representative placeholder content for the
                                third slide.
                            </p>
                        </div>
                    </div>
                </div>
                <button
                    className="carousel-control-prev"
                    type="button"
                    data-bs-target="#carouselExampleCaptions"
                    data-bs-slide="prev"
                >
                    <span
                        className="carousel-control-prev-icon"
                        aria-hidden="true"
                    ></span>
                    <span className="visually-hidden">Previous</span>
                </button>
                <button
                    className="carousel-control-next"
                    type="button"
                    data-bs-target="#carouselExampleCaptions"
                    data-bs-slide="next"
                >
                    <span
                        className="carousel-control-next-icon"
                        aria-hidden="true"
                    ></span>
                    <span className="visually-hidden">Next</span>
                </button>
            </div>
        </>
    );
}

export default GroceryCarousel;
